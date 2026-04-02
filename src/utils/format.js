// Helper function to format player names and avoid showing emails
export const formatDisplayName = (name, allNames = []) => {
  if (!name) return 'Unknown Player';

  // Handle emails
  if (name.includes('@')) {
    const prefix = name.split('@')[0];
    const parts = prefix.split(/[._-]/);

    if (parts.length > 1) {
      const firstName = parts[0];
      const lastInitial = parts[1].charAt(0);
      return `${firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()} ${lastInitial.toUpperCase()}.`;
    } else {
      return prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
    }
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];

  // If the last name is already an initial (like "M" or "M.")
  if (lastName.length === 1 || (lastName.length === 2 && lastName.endsWith('.'))) {
    return name;
  }

  const formattedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  if (!allNames || allNames.length === 0) {
    // Standard format First Name Last Initial
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${formattedFirst} ${lastInitial}.`;
  }

  // Otherwise, find collisions
  const names = allNames.map(n => (typeof n === 'object' && n !== null ? n.name : n)).filter(Boolean);

  // Find others with the same first name (case insensitive)
  const colliders = names.filter(n => {
    if (n.includes('@')) return false;
    const nParts = n.trim().split(/\s+/);
    if (nParts.length <= 1) return false;
    const nFirst = nParts[0].toLowerCase();
    return nFirst === firstName.toLowerCase() && n.toLowerCase() !== name.toLowerCase();
  });

  if (colliders.length === 0) {
    return `${formattedFirst} ${lastName.charAt(0).toUpperCase()}.`;
  }

  // We have colliders. We need to find how many letters of the last name we need.
  let neededLength = 1;
  const myLastNameLower = lastName.toLowerCase();

  for (const cName of colliders) {
    const cParts = cName.trim().split(/\s+/);
    const cLastNameLower = cParts[cParts.length - 1].toLowerCase();

    // If they have exactly the same last name, we just show the whole thing
    if (myLastNameLower === cLastNameLower) {
      neededLength = myLastNameLower.length;
      continue;
    }

    // Find common prefix length of the two last names
    let commonLen = 0;
    while (
      commonLen < myLastNameLower.length &&
      commonLen < cLastNameLower.length &&
      myLastNameLower[commonLen] === cLastNameLower[commonLen]
    ) {
      commonLen++;
    }

    // We need one more letter than the common prefix
    if (commonLen + 1 > neededLength) {
      neededLength = commonLen + 1;
    }
  }

  // Cap neededLength at my last name's length
  neededLength = Math.min(neededLength, lastName.length);

  // Format the needed part of the last name
  const neededLastNamePart = lastName.substring(0, neededLength);
  const formattedLast = neededLastNamePart.charAt(0).toUpperCase() + neededLastNamePart.slice(1).toLowerCase();

  return `${formattedFirst} ${formattedLast}.`;
};
