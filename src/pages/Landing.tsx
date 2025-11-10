import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Zap, BarChart3, Globe, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo-dima-mail.png";
import heroEmail from "@/assets/hero-email.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DimaMail" className="h-10" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-foreground hover:text-accent transition-colors">Home</a>
            <a href="#features" className="text-foreground hover:text-accent transition-colors">Features</a>
            <a href="#pricing" className="text-foreground hover:text-accent transition-colors">Pricing</a>
            <a href="#about" className="text-foreground hover:text-accent transition-colors">About</a>
            <a href="#contact" className="text-foreground hover:text-accent transition-colors">Contact</a>
          </nav>
          <Link to="/auth">
            <Button variant="default">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-heading font-bold text-foreground mb-6">
                Send your email campaigns simply and effectively
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                DimaMail is the email marketing platform that allows you to send up to 1,000,000 emails per campaign, with real-time tracking.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Discover Features
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src={heroEmail} 
                alt="Email Marketing" 
                className="rounded-lg shadow-2xl w-full h-auto object-cover scale-110"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-4">
              Everything you need to succeed with your campaigns
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Mail className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Easy Creation
                </h3>
                <p className="text-muted-foreground">
                  Create your emails in a few clicks with our visual editor.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Zap className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Secure Mass Sending
                </h3>
                <p className="text-muted-foreground">
                  Up to 1 million emails per campaign via Amazon SES.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Detailed Statistics
                </h3>
                <p className="text-muted-foreground">
                  Track your performance in real-time: opens, clicks, unsubscribes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8 pb-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                  Global Reliability
                </h3>
                <p className="text-muted-foreground">
                  Compliant with international security and deliverability standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:block">
              <Card className="shadow-lg">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-32 w-32 text-primary/40" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <h2 className="text-4xl font-heading font-bold text-foreground mb-6">
                A clear dashboard to manage all your campaigns
              </h2>
              <p className="text-xl text-muted-foreground mb-6">
                Analyze your results and improve your communication with every send.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Real-time performance overview</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Detailed graphs and statistics per campaign</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">CSV export for in-depth analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-foreground mb-4">
              Flexible plans for every need
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Starter</h3>
                <p className="text-muted-foreground mb-6">Free</p>
                <p className="text-3xl font-bold text-foreground mb-6">$0<span className="text-lg font-normal">/month</span></p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">10,000 emails per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Basic statistics</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">Get Started</Button>
              </CardContent>
            </Card>

            <Card className="border-accent border-2">
              <CardContent className="pt-8 pb-8">
                <div className="text-xs font-semibold text-accent mb-2">POPULAR</div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Pro</h3>
                <p className="text-muted-foreground mb-6">For professionals</p>
                <p className="text-3xl font-bold text-foreground mb-6">From $49<span className="text-lg font-normal">/month</span></p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 100,000 emails/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced statistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Get Started</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Enterprise</h3>
                <p className="text-muted-foreground mb-6">High volume</p>
                <p className="text-3xl font-bold text-foreground mb-6">Custom</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Up to 1 million sends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Guaranteed SLA</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">Contact Us</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <h2 className="text-4xl font-heading font-bold mb-6">
            A solution designed for professionals
          </h2>
          <p className="text-xl mb-8 opacity-90">
            DimaMail was born from the desire to offer businesses a reliable and powerful email marketing solution. Simple, fast, and effective, DimaMail helps you stay connected with your customers, wherever they are.
          </p>
          <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
            Contact Us
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-heading font-bold mb-6">
            Start sending your campaigns today
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join the businesses that trust DimaMail for their communication.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={logo} alt="DimaMail" className="h-8 mb-4 brightness-0 invert" />
              <p className="text-sm opacity-80">
                Professional email marketing platform.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#home" className="opacity-80 hover:text-accent transition-colors">Home</a></li>
                <li><a href="#features" className="opacity-80 hover:text-accent transition-colors">Features</a></li>
                <li><a href="#pricing" className="opacity-80 hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#contact" className="opacity-80 hover:text-accent transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors">FAQ</a></li>
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors">Technical Support</a></li>
                <li><a href="#" className="opacity-80 hover:text-accent transition-colors">Blog (coming soon)</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a href="#" className="opacity-80 hover:text-accent transition-colors">LinkedIn</a>
                <a href="#" className="opacity-80 hover:text-accent transition-colors">Facebook</a>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm opacity-80">
            <p>© 2025 DimaMail — All rights reserved. Made with 🇹🇳 in Tunis.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;