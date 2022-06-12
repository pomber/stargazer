import { getInputProps } from 'remotion';

const defaultProps = {
  repoOrg: 'code-hike',
  repoName: 'codehike',
  starCount: 100,
  showLogin: false,
  showRepo: true,
  duration: 15,
  fps: 30,
  width: 960,
  height: 540,
  scale: 1.875,
};

// the input from GHA will have all numbers in string format
const inputProps = { ...defaultProps, ...getInputProps() };
Object.keys(inputProps).forEach((key) => {
  if (typeof defaultProps[key] === 'number') {
    inputProps[key] = +inputProps[key];
  }
});

export { defaultProps, inputProps };
