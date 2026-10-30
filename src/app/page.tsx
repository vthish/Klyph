import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Downloader from '@/components/Downloader';
import Features from '@/components/Features';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1 }}>
        <Hero />
        <div className="container">
          <Downloader />
        </div>
        <Features />
      </div>
      <Footer />
    </main>
  );
}
