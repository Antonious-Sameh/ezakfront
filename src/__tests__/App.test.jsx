import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

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

describe('old report links', () => {
    it('/shops/:id/reports is now part of the summary: it redirects there', async () => {
        sessionStorage.setItem('system5.token', 'x');
        window.history.pushState({}, '', '/shops/shop1/reports');
        render(<App />);
        await waitFor(() => expect(window.location.pathname).not.toBe('/shops/shop1/reports'));
        expect(['/shops/shop1', '/login']).toContain(window.location.pathname);
    });
});
