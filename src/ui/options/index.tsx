import { h, render, Fragment } from 'preact';
import { OptionsPage } from './OptionsPage';

const container = document.getElementById('app');
if (container) {
  render(<OptionsPage />, container);
} else {
  console.error("Options container '#app' not found.");
}
