'use client';

import Image from 'next/image';
import { Box } from '@mui/material';

export default function StripeMark({ size = 28 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <Image src="/assets/images/brands/stripe.svg" alt="Stripe" width={size} height={size} priority />
    </Box>
  );
}
