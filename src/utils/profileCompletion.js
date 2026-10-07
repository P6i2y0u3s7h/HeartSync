export const calculateProfileCompletion = (profile) => {
  if (!profile) return { percentage: 0, missingItems: ['Complete your profile'] };

  const criteria = [
    {
      label: 'Add your name',
      weight: 15,
      completed: !!(profile.displayName || profile.firstName)
    },
    {
      label: 'Set a profile photo',
      weight: 25,
      completed: !!(profile.profilePhoto && !profile.profilePhoto.includes('logo-heart'))
    },
    {
      label: 'Add a bio describing yourself',
      weight: 20,
      completed: !!(profile.bio && profile.bio.trim().length >= 10)
    },
    {
      label: 'Add your date of birth or age',
      weight: 10,
      completed: !!(profile.age || profile.dateOfBirth)
    },
    {
      label: 'Set your city/location',
      weight: 10,
      completed: !!(profile.city && profile.city.trim().length > 0)
    },
    {
      label: 'Add at least 3 interests',
      weight: 10,
      completed: Array.isArray(profile.interests) && profile.interests.length >= 3
    },
    {
      label: 'Upload additional photos',
      weight: 10,
      completed: Array.isArray(profile.photos) && profile.photos.length >= 2
    }
  ];

  let earned = 0;
  const missingItems = [];

  criteria.forEach(item => {
    if (item.completed) {
      earned += item.weight;
    } else {
      missingItems.push(item.label);
    }
  });

  const percentage = Math.min(100, Math.max(0, earned));

  return {
    percentage,
    missingItems,
    missingTips: missingItems,
    isComplete: percentage >= 90
  };
};
