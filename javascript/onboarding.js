/**
 * Onboarding Modal System
 * Displays a 4-step tutorial for new users on their first visit
 * Syncs with backend for authenticated users, uses localStorage for anonymous
 */

import { BASE_API_URL } from '../moduls/api.js';
import { authenticatedFetch } from '../moduls/request.js';

const STORAGE_KEY = 'onboarding_completed';

class OnboardingModal {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.modal = null;
        this.steps = [];
        this.stepIndicators = [];
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.modal = document.getElementById('onboarding-modal');
        if (!this.modal) {
            console.warn('Onboarding modal not found in DOM');
            return;
        }

        this.steps = Array.from(this.modal.querySelectorAll('.onboarding-step'));
        this.stepIndicators = Array.from(this.modal.querySelectorAll('.onboarding-steps .step'));

        this.bindEvents();
        this.checkAndShow();
    }

    /**
     * Check if user needs to see onboarding
     * For authenticated users: check backend
     * For anonymous users: check localStorage
     */
    async checkAndShow() {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

        if (token) {
            // Authenticated user - check backend
            try {
                this.isAuthenticated = true;
                const response = await authenticatedFetch('/users/me');

                if (response.ok) {
                    const userData = await response.json();
                    if (!userData.onboarding_completed) {
                        this.show();
                    }
                } else {
                    // If backend fails, fallback to localStorage
                    this.checkLocalStorage();
                }
            } catch (error) {
                console.error('Failed to fetch user onboarding status:', error);
                // Fallback to localStorage
                this.checkLocalStorage();
            }
        } else {
            // Anonymous user - check localStorage
            this.isAuthenticated = false;
            this.checkLocalStorage();
        }
    }

    checkLocalStorage() {
        const completed = localStorage.getItem(STORAGE_KEY);
        if (!completed) {
            this.show();
        }
    }

    show() {
        this.modal.classList.remove('hidden');
        this.currentStep = 1;
        this.updateStep();
    }

    hide() {
        this.modal.classList.add('hidden');
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStep();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStep();
        }
    }

    updateStep() {
        // Update step visibility
        this.steps.forEach((step, index) => {
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update step indicators
        this.stepIndicators.forEach((indicator, index) => {
            if (index + 1 <= this.currentStep) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        // Update navigation buttons
        const prevBtn = this.modal.querySelector('.btn-prev');
        const nextBtn = this.modal.querySelector('.btn-next');
        const startBtn = this.modal.querySelector('.btn-start');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 1;
        }

        if (this.currentStep === this.totalSteps) {
            if (nextBtn) nextBtn.classList.add('hidden');
            if (startBtn) startBtn.classList.remove('hidden');
        } else {
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (startBtn) startBtn.classList.add('hidden');
        }
    }

    /**
     * Mark onboarding as complete
     * Save to backend for authenticated users, localStorage for anonymous
     */
    async complete() {
        const dontShowCheckbox = document.getElementById('dont-show-again');
        const dontShow = dontShowCheckbox ? dontShowCheckbox.checked : true; // Default to true on completion

        if (dontShow) {
            if (this.isAuthenticated) {
                // Save to backend for authenticated users
                try {
                    const response = await authenticatedFetch('/users/me/onboarding', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ onboarding_completed: true })
                    });

                    if (response.ok) {
                        console.log('Onboarding status saved to backend');
                    } else {
                        // Fallback to localStorage if backend fails
                        localStorage.setItem(STORAGE_KEY, 'true');
                    }
                } catch (error) {
                    console.error('Failed to save onboarding status to backend:', error);
                    // Fallback to localStorage
                    localStorage.setItem(STORAGE_KEY, 'true');
                }
            } else {
                // Anonymous user - save to localStorage only
                localStorage.setItem(STORAGE_KEY, 'true');
            }
        }

        this.hide();
    }

    skip() {
        // Don't mark as completed if skipped, so it shows again next time
        this.hide();
    }

    bindEvents() {
        // Navigation buttons
        const prevBtn = this.modal.querySelector('.btn-prev');
        const nextBtn = this.modal.querySelector('.btn-next');
        const startBtn = this.modal.querySelector('.btn-start');
        const skipBtn = this.modal.querySelector('.btn-skip');
        const closeBtn = this.modal.querySelector('.onboarding-close');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (startBtn) {
            startBtn.addEventListener('click', () => this.complete());
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.skip());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    this.skip();
                } else if (e.key === 'ArrowRight' && this.currentStep < this.totalSteps) {
                    this.nextStep();
                } else if (e.key === 'ArrowLeft' && this.currentStep > 1) {
                    this.prevStep();
                }
            }
        });

        // Prevent closing when clicking inside modal
        const modalContent = this.modal.querySelector('.onboarding-modal');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Close when clicking overlay
        this.modal.addEventListener('click', () => {
            this.skip();
        });
    }
}

// Export function to manually show onboarding (for "Ver Tutorial" button)
export function showOnboardingManual() {
    // Clear localStorage to force show
    localStorage.removeItem(STORAGE_KEY);

    // Create new instance and show
    const onboarding = new OnboardingModal();
    // Force show even if backend says completed
    onboarding.show();
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new OnboardingModal();
});
