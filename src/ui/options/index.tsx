import { render } from 'preact';
import { OptionsPage } from './OptionsPage'; // Removed .tsx extension

const container = document.getElementById('app');
if (container) {
  render(<OptionsPage />, container);
} else {
  console.error("Options container '#app' not found.");
}
