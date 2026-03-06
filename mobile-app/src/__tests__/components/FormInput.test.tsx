import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import FormInput from '../../components/FormInput';
import { renderWithTheme } from '../test-utils';

function renderComponent(props: Partial<React.ComponentProps<typeof FormInput>> = {}) {
  const defaultProps = {
    label: 'Username',
    icon: 'person-outline' as const,
    value: '',
    onChangeText: jest.fn(),
  };
  return renderWithTheme(<FormInput {...defaultProps} {...props} />);
}

describe('FormInput', () => {
  it('renders label', () => {
    const { getByText } = renderComponent();
    expect(getByText('Username')).toBeTruthy();
  });

  it('renders placeholder', () => {
    const { getByPlaceholderText } = renderComponent({ placeholder: 'Enter username' });
    expect(getByPlaceholderText('Enter username')).toBeTruthy();
  });

  it('calls onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderComponent({
      placeholder: 'Type here',
      onChangeText,
    });
    fireEvent.changeText(getByPlaceholderText('Type here'), 'test');
    expect(onChangeText).toHaveBeenCalledWith('test');
  });

  it('renders error text', () => {
    const { getByText } = renderComponent({ error: 'Required field' });
    expect(getByText('Required field')).toBeTruthy();
  });

  it('does not render error when not provided', () => {
    const { queryByText } = renderComponent();
    expect(queryByText('Required field')).toBeNull();
  });

  it('renders password toggle when showPasswordToggle is true', () => {
    const onToggle = jest.fn();
    const { getByLabelText } = renderComponent({
      secureTextEntry: true,
      showPasswordToggle: true,
      showPassword: false,
      onTogglePassword: onToggle,
    });
    fireEvent.press(getByLabelText('Show password'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
