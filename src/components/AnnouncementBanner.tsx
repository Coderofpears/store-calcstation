import defaultBanner from "@/assets/banners/announcement-wide.jpg";

interface BannerProps {
  image?: string;
  alt?: string;
  href?: string;
}

const AnnouncementBanner = ({ image, alt, href }: BannerProps) => {
  const img = image || defaultBanner;
  const content = (
    <img
      src={img}
      alt={alt || "Store announcement"}
      loading="lazy"
      className="w-full rounded-lg shadow-glow hover:opacity-95 hover-scale"
    />
  );

  return (
    <div className="my-6" aria-label="Announcement">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer noopener">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
};

export default AnnouncementBanner;
