'use client';
import PropTypes from 'prop-types';

// @next
import NextLink from 'next/link';

// @mui
import { useTheme } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';

// @project
import LogoMain from './LogoMain';
import LogoIcon from './LogoIcon';
import { APP_DEFAULT_PATH } from '@/config';
import { generateFocusStyle } from '@/utils/generateFocusStyle';

/***************************  MAIN - LOGO  ***************************/

export default function LogoSection({ isIcon, sx, to }) {
  const theme = useTheme();

  return (
    <ButtonBase
      component={NextLink}
      href={!to ? APP_DEFAULT_PATH : to}
      disableRipple
      sx={{ ...sx, '&:focus-visible': generateFocusStyle(theme.palette.primary.main) }}
      aria-label="logo"
    >
      {isIcon ? <LogoIcon /> : <LogoMain />}
    </ButtonBase>
  );
}

LogoSection.propTypes = { isIcon: PropTypes.bool, sx: PropTypes.any, to: PropTypes.string };
