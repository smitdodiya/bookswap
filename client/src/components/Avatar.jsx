import { useNavigate } from "react-router-dom";
import { avatarClass, initials } from "../lib/ui";

export default function Avatar({ name, size = "md", userId }) {
  const navigate = useNavigate();
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-20 w-20 text-2xl",
  };
  const base = `${sizes[size]} ${avatarClass(name)} flex shrink-0 items-center justify-center rounded-full font-semibold text-ink/70`;

  // When a userId is provided the avatar becomes a link to that person's profile.
  // (Only use this where the avatar is NOT nested inside another button.)
  if (userId) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/u/${userId}`);
        }}
        title={`View ${name}'s profile`}
        className={`${base} cursor-pointer ring-primary/40 transition hover:ring-2`}
      >
        {initials(name)}
      </button>
    );
  }

  return (
    <div className={base} title={name}>
      {initials(name)}
    </div>
  );
}
