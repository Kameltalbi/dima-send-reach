export const Logo = ({ className = "h-12 w-12" }: { className?: string }) => {
  return (
    <img 
      src="/logoDimaMail.png" 
      alt="DimaMail Logo" 
      className={`${className} object-contain`}
    />
  );
};

export const LogoWithText = ({ className = "h-14" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/logoDimaMail.png" 
        alt="DimaMail Logo" 
        className="h-12 w-auto object-contain"
      />
    </div>
  );
};

export const LogoLight = ({ className = "h-12 w-12" }: { className?: string }) => {
  return (
    <img 
      src="/logoDimaMail.png" 
      alt="DimaMail Logo" 
      className={`${className} object-contain`}
    />
  );
};

