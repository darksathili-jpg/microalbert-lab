"""Start the offline teacher pilot on the loopback interface."""
import uvicorn

from .access_security import FixedWindowRateLimiter, Principal
from .main import app, get_secure_limiter, get_secure_registry, get_tutor_adapter


def main():
    # This dedicated launcher cannot activate the real provider.
    app.dependency_overrides[get_tutor_adapter] = lambda: None
    limiter = FixedWindowRateLimiter(limit=20, window_seconds=60)
    app.dependency_overrides[get_secure_limiter] = lambda: limiter
    token = get_secure_registry().issue(Principal("enseignant-local", "enseignant"))
    print("Jeton temporaire du pilote local (distinct de la clé Albert) :", token, flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8000, workers=1)


if __name__ == "__main__":
    main()
