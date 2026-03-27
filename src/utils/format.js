// Helper function to format player names and avoid showing emails
export const formatDisplayName = (name) => {
  if (!name) return 'Unknown Player';

  if (name.includes('@')) {
    const prefix = name.split('@')[0];

    // Check if the prefix contains dot, underscore, or hyphen
    const parts = prefix.split(/[._-]/);

    if (parts.length > 1) {
      // First name and last initial
      const firstName = parts[0];
      const lastInitial = parts[1].charAt(0);

      const formattedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      const formattedLast = lastInitial.toUpperCase();

      return `${formattedFirst} ${formattedLast}.`;
    } else {
      // Just return the prefix, capitalized
      return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    }
  }

  // Normal names like "John Doe" or "BRENDAN M."
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];

    // Check if the last name is already an initial (like "M" or "M.")
    if (lastName.length === 1 || (lastName.length === 2 && lastName.endsWith('.'))) {
       // Return as is (might be all caps like BRENDAN M. which is what they want)
       return name;
    }

    // Else format First Name Last Initial
    const formattedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const lastInitial = lastName.charAt(0).toUpperCase();

    return `${formattedFirst} ${lastInitial}.`;
  }

  // Single word name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};
