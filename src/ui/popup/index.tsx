import { h, render, Fragment } from 'preact';
import { Popup } from './Popup';

const container = document.getElementById('app');
if (container) {
  render(<Popup />, container);
} else {
  console.error("Popup container '#app' not found.");
}
