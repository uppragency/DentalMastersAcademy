import Image from "next/image";

export function TrainerAvatar({ name, photo, size = 64 }: { name: string; photo?: string | null; size?: number }) {
  const initials = name.replace("Dr. ", "").split(" ").map((p) => p[0]).join("");
  if (photo) {
    return <Image src={photo} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden="true" style={{ width: size, height: size, fontSize: size * 0.36 }} className="font-display flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold text-ink">
      {initials}
    </span>
  );
}
