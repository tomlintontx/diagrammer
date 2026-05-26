import { uid } from './math.js';
import { store } from './store.js';

export function makeShape(type, props) {
  const { styleDefaults } = store;
  return {
    id: uid(),
    type,
    strokeColor: styleDefaults.strokeColor,
    fillColor: styleDefaults.fillColor,
    strokeWidth: styleDefaults.strokeWidth,
    roughness: styleDefaults.roughness,
    fontSize: styleDefaults.fontSize,
    fontFamily: styleDefaults.fontFamily,
    textAlign: styleDefaults.textAlign,
    opacity: styleDefaults.opacity,
    strokeStyle: styleDefaults.strokeStyle,
    fillStyle: styleDefaults.fillStyle,
    text: '',
    seed: Math.floor(Math.random() * 10000) + 1,
    ...props,
  };
}
