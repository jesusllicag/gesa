import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return <img {...props} src="/storage/utp-logo.png" alt="App Logo" />;
}
