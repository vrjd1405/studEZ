export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background/70 to-primary/15 backdrop-blur-[2px]">
      {children}
    </div>
  )
}
