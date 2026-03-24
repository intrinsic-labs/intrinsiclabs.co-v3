type YouTubeEmbedProps = {
  id: string;
  title?: string;
  start?: number;
};

export function YouTubeEmbed({
  id,
  title = "YouTube video",
  start,
}: YouTubeEmbedProps) {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
  });

  if (typeof start === "number" && Number.isFinite(start) && start >= 0) {
    params.set("start", Math.floor(start).toString());
  }

  return (
    <div className="case-study-video">
      <iframe
        src={`https://www.youtube.com/embed/${id}?${params.toString()}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
