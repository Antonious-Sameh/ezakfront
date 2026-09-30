import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('virtual:pwa-register', () => ({ registerSW: () => () => {} }), { virtual: true });

const { default: App } = await import('@/App');

beforeEach(() => {
    window.history.pushState({}, '', '/');
});

describe('App with lazily loaded pages', () => {
    it('loads the (lazy) login page for a signed-out visitor', async () => {
        render(<App />);

        expect(await screen.findByLabelText(/كلمة/)).toBeInTheDocument();
        expect(window.location.pathname).toBe('/login');
    });
});

describe('PageFallback', () => {
    it('is announced to screen readers while a page chunk downloads', async () => {
        const { default: PageFallback } = await import('@/components/PageFallback');
        render(<PageFallback />);
        expect(screen.getByRole('status', { name: 'جاري التحميل' })).toBeInTheDocument();
    });
});
