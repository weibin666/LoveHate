from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Post, PostLike
from app.schemas import PostCreate, PostOut
from app.ws import manager

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.post("", response_model=PostOut)
async def create_post(
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    post = Post(
        couple_id=current_user.couple_id,
        author_id=current_user.id,
        content=data.content,
        image_url=data.image_url,
        mood=data.mood,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    await manager.send_to_couple(current_user.couple_id, {
        "type": "new_post",
        "author_nickname": current_user.nickname,
        "content": data.content[:50],
    })

    return PostOut(
        id=post.id,
        author_id=post.author_id,
        author_nickname=current_user.nickname,
        content=post.content,
        image_url=post.image_url,
        mood=post.mood,
        likes=0,
        is_liked=False,
        created_at=post.created_at,
    )


@router.get("", response_model=list[PostOut])
async def get_posts(
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.couple_id:
        raise HTTPException(status_code=400, detail="Not in a couple")

    result = await db.execute(
        select(Post)
        .where(Post.couple_id == current_user.couple_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    posts = result.scalars().all()

    liked_result = await db.execute(
        select(PostLike.post_id).where(PostLike.user_id == current_user.id)
    )
    liked_ids = {row[0] for row in liked_result.all()}

    out = []
    for p in posts:
        author_r = await db.execute(select(User).where(User.id == p.author_id))
        author = author_r.scalar_one_or_none()
        out.append(PostOut(
            id=p.id,
            author_id=p.author_id,
            author_nickname=author.nickname if author else "Unknown",
            content=p.content,
            image_url=p.image_url,
            mood=p.mood,
            likes=p.likes,
            is_liked=p.id in liked_ids,
            created_at=p.created_at,
        ))
    return out


@router.post("/{post_id}/like")
async def toggle_like(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = await db.execute(
        select(PostLike).where(
            PostLike.post_id == post_id,
            PostLike.user_id == current_user.id,
        )
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        post.likes = max(0, post.likes - 1)
        await db.commit()
        return {"liked": False, "likes": post.likes}
    else:
        db.add(PostLike(post_id=post_id, user_id=current_user.id))
        post.likes += 1
        await db.commit()
        return {"liked": True, "likes": post.likes}


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.author_id == current_user.id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await db.delete(post)
    await db.commit()
    return {"detail": "Post deleted"}
