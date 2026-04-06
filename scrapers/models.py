from dataclasses import dataclass, asdict
from typing import Optional, Any
import json


@dataclass
class RawPost:
    source_url: str
    platform: str        # "twitter" | "youtube" | "instagram" | "news"
    author: str
    content: str
    post_timestamp: int  # Unix ms
    author_id: Optional[str] = None
    raw_metadata: Optional[dict[str, Any]] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        return {k: v for k, v in d.items() if v is not None}

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_dict(cls, data: dict) -> "RawPost":
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})

    @classmethod
    def from_json(cls, json_str: str) -> "RawPost":
        return cls.from_dict(json.loads(json_str))
