class BannedAccountError(Exception):
    """Raised by a poster when the platform has banned or invalidated the account."""
    def __init__(self, platform: str, reason: str):
        self.platform = platform
        self.reason = reason
        super().__init__(f"{platform} account banned: {reason}")
