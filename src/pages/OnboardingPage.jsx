import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WaveBackground from '../components/WaveBackground';

const ONBOARDING_SLIDES = [
  {
    image: '/assets/onboard-vibe.jpg',
    titleMain: 'Smart Matches Based on Your ',
    titleAccent: 'Vibe !',
    description: 'We match you with people who share your energy, interests & intentions.'
  },
  {
    image: '/assets/onboard-verified.jpg',
    titleMain: 'Only Verified & Genuine ',
    titleAccent: 'Profile!',
    description: 'No fake accounts. Every profile goes through basic verification so you feel safe.'
  },
  {
    image: '/assets/onboard-location.jpg',
    titleMain: 'Find People Near You !',
    titleAccent: '',
    description: 'Location-based suggestions help you meet compatible people around you.'
  }
];

export const OnboardingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem('heartsync_seen_onboarding', 'true');
    navigate('/login');
  };

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <div className="mobile-app-shell">
      <div className="onboarding-screen">
        {/* Large Centered Illustration with whitespace */}
        <div className="onboarding-illustration-area animate-fade-in" key={`img-${currentSlide}`}>
          <img
            src={slide.image}
            alt="HeartSync Onboarding"
            className="onboarding-hero-image"
          />
        </div>

        {/* Content Section: Heading + Description */}
        <div className="onboarding-text-area animate-slide-up" key={`text-${currentSlide}`}>
          <h1 className="onboarding-heading">
            {slide.titleMain}
            {slide.titleAccent && <span className="highlight-pink">{slide.titleAccent}</span>}
          </h1>
          <p className="onboarding-desc">{slide.description}</p>
        </div>

        {/* Pagination Dots (Active pill + round dots) */}
        <div className="onboarding-pagination-row">
          {ONBOARDING_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`pagination-indicator ${idx === currentSlide ? 'active-pill' : 'inactive-dot'}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bottom Actions Row: Skip on left, Next/Get Started on right */}
        <div className="onboarding-bottom-actions">
          {currentSlide < ONBOARDING_SLIDES.length - 1 ? (
            <>
              <button
                id="btn-onboarding-skip"
                type="button"
                className="onboarding-skip-link"
                onClick={handleFinish}
              >
                Skip
              </button>
              <button
                id="btn-onboarding-next"
                type="button"
                className="onboarding-next-pill-btn"
                onClick={handleNext}
              >
                NEXT
              </button>
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="btn-get-started"
                type="button"
                className="onboarding-next-pill-btn get-started-btn"
                onClick={handleFinish}
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Bottom Layered Soft Waves */}
        <WaveBackground />
      </div>
    </div>
  );
};

export default OnboardingPage;
