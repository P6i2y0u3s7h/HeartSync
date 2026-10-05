import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WaveBackground from '../components/WaveBackground';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, loading, updateProfile } = useAuth();

  useEffect(() => {
    if (loading) return;
    // If the authenticated user has already completed onboarding, do NOT show it again
    if (userProfile?.onboardingCompleted) {
      if (userProfile?.profileCompleted) {
        navigate('/home', { replace: true });
      } else {
        navigate('/profile-setup', { replace: true });
      }
    }
  }, [loading, userProfile, navigate]);

  const stepParam = parseInt(searchParams.get('step') || '1', 10);
  const currentSlide = Math.min(Math.max(stepParam - 1, 0), ONBOARDING_SLIDES.length - 1);

  const goToSlide = (slideIndex) => {
    setSearchParams({ step: (slideIndex + 1).toString() });
  };

  const handleSkipOrFinish = async () => {
    if (currentUser?.uid) {
      try {
        await updateProfile({ onboardingCompleted: true });
      } catch (err) {
        console.warn('Could not persist onboarding status:', err);
      }
    }
    // Navigate directly to Profile Information
    navigate('/profile-setup');
  };

  const handleNext = () => {
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      handleSkipOrFinish();
    }
  };

  // Prevent flashing onboarding screens for existing users while Firestore profile data is loading
  if (loading) {
    return (
      <div className="mobile-app-shell">
        <div className="fullscreen-loading">
          <LoadingSpinner text="Loading..." />
        </div>
      </div>
    );
  }

  if (userProfile?.onboardingCompleted) {
    return null;
  }

  const slide = ONBOARDING_SLIDES[currentSlide];

  return (
    <div className="mobile-app-shell">
      <div className="onboarding-screen">
        {/* Top bar with back arrow if on screen 2 or 3 */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 0', minHeight: '44px', zIndex: 10 }}>
          {currentSlide > 0 ? (
            <button
              type="button"
              onClick={() => goToSlide(currentSlide - 1)}
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ad1457',
                boxShadow: '0 2px 6px rgba(173, 20, 87, 0.15)'
              }}
              aria-label="Back to previous screen"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <div style={{ width: 36, height: 36 }} />
          )}
        </div>

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
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bottom Actions Row: Skip on left, Next or Get Started on right */}
        <div className="onboarding-bottom-actions">
          <button
            id="btn-onboarding-skip"
            type="button"
            className="onboarding-skip-link"
            onClick={handleSkipOrFinish}
          >
            Skip
          </button>

          {currentSlide < ONBOARDING_SLIDES.length - 1 ? (
            <button
              id="btn-onboarding-next"
              type="button"
              className="onboarding-next-pill-btn"
              onClick={handleNext}
            >
              NEXT
            </button>
          ) : (
            <button
              id="btn-get-started"
              type="button"
              className="onboarding-next-pill-btn get-started-btn"
              onClick={handleSkipOrFinish}
            >
              Get Started
            </button>
          )}
        </div>

        {/* Bottom Layered Soft Waves */}
        <WaveBackground />
      </div>
    </div>
  );
};

export default OnboardingPage;
