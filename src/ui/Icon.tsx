import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

type Props = {
  icon: IconProp;
  size?: number;
  color?: string;
};

/**
 * Font Awesome icon rendered through the official React Native component.
 * Every icon in the app comes from fontawesome.com — no emojis anywhere.
 */
export default function FaIcon({ icon, size = 18, color }: Props) {
  return <FontAwesomeIcon icon={icon} size={size} color={color} />;
}
