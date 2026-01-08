import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LoginForm from './LoginForm.vue';
import { useAuthStore } from '@/stores/auth';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
  });

  it('renders login form correctly', () => {
    const wrapper = mount(LoginForm);

    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('validates email field', async () => {
    const wrapper = mount(LoginForm);
    const form = wrapper.find('form');

    // Submit without email
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Pole jest wymagane');
  });

  it('validates email format', async () => {
    const wrapper = mount(LoginForm);
    const emailInput = wrapper.find('input[type="email"]');

    // Enter invalid email
    await emailInput.setValue('invalid-email');
    const form = wrapper.find('form');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Proszę podać poprawny adres e-mail');
  });

  it('validates password field', async () => {
    const wrapper = mount(LoginForm);
    const emailInput = wrapper.find('input[type="email"]');
    const form = wrapper.find('form');

    // Enter valid email but no password
    await emailInput.setValue('test@example.com');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Pole jest wymagane');
  });

  it('calls authStore.login on valid form submission', async () => {
    const wrapper = mount(LoginForm);
    const authStore = useAuthStore();
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue();

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const form = wrapper.find('form');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('Password123!');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(loginSpy).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
    });
  });

  it('redirects to trainer dashboard for trainer users', async () => {
    const wrapper = mount(LoginForm);
    const authStore = useAuthStore();

    vi.spyOn(authStore, 'login').mockResolvedValue();
    vi.spyOn(authStore, 'isTrainer', 'get').mockReturnValue(true);

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const form = wrapper.find('form');

    await emailInput.setValue('trainer@example.com');
    await passwordInput.setValue('Password123!');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockPush).toHaveBeenCalledWith('/trainer/dashboard');
  });

  it('redirects to client dashboard for client users', async () => {
    const wrapper = mount(LoginForm);
    const authStore = useAuthStore();

    vi.spyOn(authStore, 'login').mockResolvedValue();
    vi.spyOn(authStore, 'isTrainer', 'get').mockReturnValue(false);

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const form = wrapper.find('form');

    await emailInput.setValue('client@example.com');
    await passwordInput.setValue('Password123!');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('displays error message on login failure', async () => {
    const wrapper = mount(LoginForm);
    const authStore = useAuthStore();

    const error = {
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    };

    vi.spyOn(authStore, 'login').mockRejectedValue(error);

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const form = wrapper.find('form');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('WrongPassword');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Nieprawidłowy e-mail lub hasło');
  });

  it('shows loading state during submission', async () => {
    const wrapper = mount(LoginForm);
    const authStore = useAuthStore();

    // Mock a delayed login
    vi.spyOn(authStore, 'login').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    const form = wrapper.find('form');

    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('Password123!');
    await form.trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    // Check for loading state (button should be disabled)
    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('disabled')).toBeDefined();
  });
});
