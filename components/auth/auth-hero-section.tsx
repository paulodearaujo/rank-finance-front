import Image from "next/image";

export function AuthHeroSection() {
  return (
    <div className="relative hidden w-1/2 overflow-hidden bg-auth-hero-bg lg:block">
      {/* PostCSS Logo - positioned to be cut by the white section */}
      <div
        className="absolute"
        style={{
          right: "-250px",
          top: "50%",
          transform: "translateY(-50%) rotate(-20deg) scaleX(-1)",
          opacity: "var(--auth-logo-opacity)",
        }}
      >
        <Image
          src="/postcss.svg"
          alt="PostCSS decorative logo"
          width={900}
          height={900}
          className="select-none pointer-events-none"
          aria-hidden="true"
          priority
          fetchPriority="high"
          quality={85}
        />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-16">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-auth-hero-title">
            Rank Tracker
          </h1>
          <p className="mt-2 text-base font-light tracking-wide text-auth-hero-subtitle">
            AppStore & Google Play ranking analytics
          </p>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-light tracking-wide text-auth-hero-brand">
              Made by InLab Mafia
            </h2>
            <p className="max-w-md text-sm font-light leading-relaxed text-auth-hero-text">
              "We choose to go to the Moon… not because it is easy, but because it is hard." — John
              F. Kennedy"
            </p>
          </div>

          <div className="border-t border-auth-hero-divider pt-6">
            <p className="text-xs font-light tracking-wider text-auth-hero-footer">
              © 2025 CloudWalk · InLab
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
