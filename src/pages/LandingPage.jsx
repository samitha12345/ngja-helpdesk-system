import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  {
    image: '/helpdesk-support.jpg',
    alt: 'NGJA helpdesk support team ready to assist employees',
    title: 'NGJA Employee Helpdesk',
    description: 'Get the support you need and keep track of your requests in one place.',
  },
  {
    image: '/landing-ngja-1.jpg',
    alt: 'Visitors at a gem and jewellery exhibition in Sri Lanka',
    title: 'Supporting Sri Lanka’s Gem Industry',
    description: 'A dedicated support service for the people behind our gem and jewellery industry.',
  },
  {
    image: '/landing-ngja-2.jpg',
    alt: 'NGJA representatives at an official event',
    title: 'Here to Help You',
    description: 'Connect with the right team and follow your helpdesk requests from start to finish.',
  },
  {
    image: '/landing-ngja-3.jpg',
    alt: 'A group attending an NGJA gem industry event',
    title: 'Your NGJA Support Portal',
    description: 'Sign in or create an account to access the employee helpdesk.',
  },
];

const LandingPage = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const slide = slides[activeSlide];

  return (
    <main className="landing-page">
      <img
        key={slide.image}
        className="landing-background"
        src={slide.image}
        alt={slide.alt}
      />
      <div className="landing-shade" />

      <section className="landing-content" aria-live="polite">
        <span className="landing-eyebrow">National Gem and Jewellery Authority</span>
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>

        <div className="landing-actions">
          <Link className="landing-button landing-button-primary" to="/login">
            Sign In
          </Link>
          <Link className="landing-button landing-button-secondary" to="/register">
            Sign Up
          </Link>
        </div>

        <div className="landing-dots" aria-label="Choose a featured image">
          {slides.map((item, index) => (
            <button
              key={item.image}
              type="button"
              className={`landing-dot${index === activeSlide ? ' is-active' : ''}`}
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === activeSlide}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default LandingPage;
