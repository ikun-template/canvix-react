import { documentDefaults } from '@canvix-react/schema-document';
import { pageDefaults } from '@canvix-react/schema-page';
import { widgetDefaults } from '@canvix-react/schema-widget';

export function createDefaultDocument() {
  return documentDefaults({
    title: 'Untitled',
    pages: [
      pageDefaults({
        name: 'Page 1',
        layout: {
          direction: 'row',
          wrap: 'wrap',
        },
        widgets: [
          widgetDefaults({
            type: 'text',
            name: 'Hello',
            position: { axis: [100, 100] },
            layout: { size: [200, 80] },
            custom_data: {
              content: 'Hello, Canvix!',
              fontSize: 24,
              color: '#efefef',
              align: 'center',
            },
          }),
          widgetDefaults({
            type: 'shape',
            name: 'Rect',
            position: { axis: [400, 100] },
            layout: { size: [150, 180] },
            custom_data: {
              shape: 'rect',
              fill: '#4f9cf5',
              stroke: '',
              strokeWidth: 0,
              borderRadius: 8,
            },
          }),
          widgetDefaults({
            type: 'image',
            name: 'Image',
            position: { axis: [100, 250] },
            layout: { size: [200, 150] },
            custom_data: {
              src: '',
              alt: 'Placeholder',
              fit: 'cover',
            },
          }),
          widgetDefaults({
            type: 'shape',
            name: 'Rect',
            position: { axis: [400, 100] },
            layout: { size: [150, 180] },
            custom_data: {
              shape: 'rect',
              fill: '#4f9cf5',
              stroke: '',
              strokeWidth: 0,
              borderRadius: 8,
            },
          }),
          widgetDefaults({
            type: 'image',
            name: 'Image',
            position: { axis: [100, 250] },
            layout: { size: [200, 150] },
            custom_data: {
              src: '',
              alt: 'Placeholder',
              fit: 'cover',
            },
          }),
          widgetDefaults({
            type: 'shape',
            name: 'Rect',
            position: { axis: [400, 100] },
            layout: { size: [150, 180] },
            custom_data: {
              shape: 'rect',
              fill: '#4f9cf5',
              stroke: '',
              strokeWidth: 0,
              borderRadius: 8,
            },
          }),
          widgetDefaults({
            type: 'image',
            name: 'Image',
            position: { axis: [100, 250] },
            layout: { size: [200, 150] },
            custom_data: {
              src: '',
              alt: 'Placeholder',
              fit: 'cover',
            },
          }),
          widgetDefaults({
            type: 'shape',
            name: 'Rect',
            position: { axis: [400, 100] },
            layout: { size: [150, 180] },
            custom_data: {
              shape: 'rect',
              fill: '#4f9cf5',
              stroke: '',
              strokeWidth: 0,
              borderRadius: 8,
            },
          }),
          widgetDefaults({
            type: 'image',
            name: 'Image',
            position: { axis: [100, 250] },
            layout: { size: [200, 150] },
            custom_data: {
              src: '',
              alt: 'Placeholder',
              fit: 'cover',
            },
          }),
        ],
      }),
    ],
  });
}
