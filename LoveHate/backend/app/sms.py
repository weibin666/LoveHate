import random
import json
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

CODE_EXPIRE_MINUTES = 5


class MockSmsProvider:
    async def send_code(self, phone: str, code: str) -> bool:
        logger.info(f"[MOCK SMS] Sending code {code} to {phone}")
        return True


class AliyunSmsProvider:
    def __init__(self, access_key: str, access_secret: str, sign_name: str, template_code: str):
        self.access_key = access_key
        self.access_secret = access_secret
        self.sign_name = sign_name
        self.template_code = template_code

    async def send_code(self, phone: str, code: str) -> bool:
        import hmac
        import hashlib
        import base64
        import urllib.parse
        import httpx

        params = {
            "PhoneNumbers": phone,
            "SignName": self.sign_name,
            "TemplateCode": self.template_code,
            "TemplateParam": json.dumps({"code": code}),
            "Action": "SendSms",
            "Version": "2017-05-25",
            "Format": "JSON",
            "AccessKeyId": self.access_key,
            "SignatureMethod": "HMAC-SHA1",
            "SignatureVersion": "1.0",
            "SignatureNonce": str(random.randint(100000, 999999)),
            "Timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }

        sorted_params = sorted(params.items())
        query_string = urllib.parse.urlencode(sorted_params, quote_via=urllib.parse.quote)
        string_to_sign = "GET&%2F&" + urllib.parse.quote(query_string, safe="")
        signature = base64.b64encode(
            hmac.new((self.access_secret + "&").encode(), string_to_sign.encode(), hashlib.sha1).digest()
        ).decode()

        url = f"https://dysmsapi.aliyuncs.com/?Signature={urllib.parse.quote(signature)}&{query_string}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            result = resp.json()
            if result.get("Code") == "OK":
                return True
            logger.error(f"SMS send failed: {result}")
            return False


class TencentSmsProvider:
    def __init__(self, access_key: str, access_secret: str, sign_name: str, template_code: str):
        self.access_key = access_key
        self.access_secret = access_secret
        self.sign_name = sign_name
        self.template_code = template_code

    async def send_code(self, phone: str, code: str) -> bool:
        import httpx

        url = "https://sms.tencentcloudapi.com"
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json={
                "PhoneNumberSet": [f"+86{phone}"],
                "SmsSdkAppId": self.access_key,
                "SignName": self.sign_name,
                "TemplateId": self.template_code,
                "TemplateParamSet": [code],
            })
            return resp.status_code == 200
        return False


def get_sms_provider():
    from app.config import settings

    if settings.SMS_PROVIDER == "aliyun":
        return AliyunSmsProvider(
            settings.SMS_ACCESS_KEY, settings.SMS_ACCESS_SECRET,
            settings.SMS_SIGN_NAME, settings.SMS_TEMPLATE_CODE,
        )
    elif settings.SMS_PROVIDER == "tencent":
        return TencentSmsProvider(
            settings.SMS_ACCESS_KEY, settings.SMS_ACCESS_SECRET,
            settings.SMS_SIGN_NAME, settings.SMS_TEMPLATE_CODE,
        )
    return MockSmsProvider()


def generate_code() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(6)])
