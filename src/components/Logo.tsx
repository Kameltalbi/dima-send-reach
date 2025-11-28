import { Mail, ArrowUp } from "lucide-react";

export const Logo = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* Enveloppe */}
      <Mail className="h-full w-full text-primary" strokeWidth={2} />
      {/* Flèches vers le haut - positionnées au-dessus de l'enveloppe */}
      <div className="absolute -top-2 right-0 flex flex-col items-center gap-0.5">
        <ArrowUp className="h-2.5 w-2.5 text-accent" strokeWidth={3} fill="currentColor" />
        <ArrowUp className="h-2 w-2 text-accent" strokeWidth={3} fill="currentColor" />
      </div>
    </div>
  );
};

export const LogoWithText = ({ className = "h-10" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo className="h-8 w-8" />
      <span className="text-xl font-heading font-bold text-foreground">
        Dima<span className="text-primary">Mail</span>
        <span className="text-primary">.</span>
      </span>
    </div>
  );
};

export const LogoLight = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* Enveloppe - couleur claire pour fond sombre */}
      <Mail className="h-full w-full text-white" strokeWidth={2} />
      {/* Flèches vers le haut - couleur claire */}
      <div className="absolute -top-2 right-0 flex flex-col items-center gap-0.5">
        <ArrowUp className="h-2.5 w-2.5 text-accent-foreground" strokeWidth={3} fill="currentColor" />
        <ArrowUp className="h-2 w-2 text-accent-foreground" strokeWidth={3} fill="currentColor" />
      </div>
    </div>
  );
};

