import trafilatura


def scrape(url: str) -> tuple[str, str]:
    """
    Fetch a URL and extract its main text content.
    Returns (title, plain_text).
    Raises ValueError if the page cannot be fetched or has no text.
    """
    html = trafilatura.fetch_url(url)
    if not html:
        raise ValueError(f"Could not fetch URL: {url}")

    text = trafilatura.extract(
        html,
        include_comments=False,
        include_tables=True,
        no_fallback=False,
    )
    if not text:
        raise ValueError(f"No readable text content found at: {url}")

    metadata = trafilatura.extract_metadata(html)
    title = (metadata.title if metadata and metadata.title else None) or url

    return title, text
