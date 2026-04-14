import React from 'react';

interface IFormState {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
}

interface IState {
    form: IFormState;
    globalError: string | null;
    submitting: boolean;
    focusedField: string | null;
}

const INITIAL_FORM: IFormState = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
};

const styles: {[key: string]: React.CSSProperties} = {
    card: {
        background: '#ffffff',
        borderRadius: 12,
        padding: '40px 36px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.08)',
    },
    logo: {
        display: 'block',
        marginBottom: 32,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    heading: {
        fontSize: 22,
        fontWeight: 600,
        marginBottom: 6,
        color: '#111827',
        letterSpacing: '-0.3px',
        textAlign: 'center' as const,
    },
    subheading: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 28,
        textAlign: 'center' as const,
    },
    row: {
        display: 'flex',
        gap: 12,
    },
    field: {
        marginBottom: 16,
        flex: 1,
    },
    label: {
        display: 'block',
        fontSize: 13,
        fontWeight: 500,
        marginBottom: 6,
        color: '#374151',
    },
    input: {
        width: '100%',
        height: 40,
        padding: '0 12px',
        background: '#ffffff',
        border: '1.5px solid #d1d5db',
        borderRadius: 8,
        fontSize: 14,
        color: '#111827',
        outline: 'none',
        boxSizing: 'border-box' as const,
    },
    inputFocused: {
        border: '1.5px solid #a8d5bc',
        boxShadow: '0 0 0 2px rgba(30, 176, 108, 0.06)',
    },
    globalError: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#dc2626',
        fontSize: 13,
        marginBottom: 16,
    },
    submitBtn: {
        width: '100%',
        height: 42,
        background: '#1eb06c',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: 8,
        letterSpacing: '0.01em',
    },
    submitBtnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
    },
    footer: {
        textAlign: 'center' as const,
        marginTop: 24,
        fontSize: 13,
        color: '#6b7280',
    },
    loginLink: {
        color: '#1eb06c',
        textDecoration: 'none',
        fontWeight: 500,
        marginLeft: 4,
    },
};

export class RegisterPage extends React.Component<{}, IState> {
    state: IState = {
        form: { ...INITIAL_FORM },
        globalError: null,
        submitting: false,
        focusedField: null,
    };

    private handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        this.setState((prev) => ({
            form: { ...prev.form, [name]: value },
        }));
    }

    private startSession = async(username: string, password: string) => {
        const apiUrl = __SUPERDESK_CONFIG__.server.url;
        const authResponse = await fetch(`${apiUrl}/auth_db`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (authResponse.ok) {
            const session = await authResponse.json();
            const token = 'Basic ' + btoa(session.token + ':');

            localStorage.setItem('sess:token', token);
            localStorage.setItem('sess:id', session._id);
            if (session._links && session._links.self) {
                localStorage.setItem('sess:href', session._links.self.href);
            }

            const userResponse = await fetch(`${apiUrl}/liveblog_users/${session.user}`, {
                headers: { Authorization: token },
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();

                localStorage.setItem('sess:user', JSON.stringify(userData));
            }
        }

        window.location.href = '/';
    }

    private handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        this.setState({ submitting: true, globalError: null });

        const { form } = this.state;
        const payload = {
            first_name: form.firstName,
            last_name: form.lastName,
            username: form.username,
            email: form.email,
            password: form.password,
        };

        try {
            const apiUrl = __SUPERDESK_CONFIG__.server.url;
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.status === 201) {
                await this.startSession(form.username, form.password);
                return;
            }

            const message = data._error || data.message || 'Registration failed. Please try again.';

            this.setState({ globalError: message, submitting: false });
        } catch (_err) {
            this.setState({ globalError: 'Cannot reach the server. Please try again later.', submitting: false });
        }
    }

    private inputStyle(name: string) {
        const { focusedField } = this.state;

        return focusedField === name
            ? { ...styles.input, ...styles.inputFocused }
            : styles.input;
    }

    render() {
        const { form, globalError, submitting } = this.state;

        return (
            <div style={styles.card}>
                <img
                    src="/images/superdesk-logo.svg"
                    width="160"
                    alt="Liveblog"
                    style={styles.logo}
                />

                <div style={styles.heading}>Create an account</div>
                <div style={styles.subheading}>Start your Liveblog in seconds.</div>

                <form onSubmit={this.handleSubmit} noValidate>
                    {globalError && (
                        <div style={styles.globalError}>{globalError}</div>
                    )}

                    <div style={styles.row}>
                        {(['firstName', 'lastName'] as const).map((name) => (
                            <div key={name} style={styles.field}>
                                <label style={styles.label} htmlFor={name}>
                                    {name === 'firstName' ? 'First name' : 'Last name'}
                                </label>
                                <input
                                    id={name}
                                    name={name}
                                    type="text"
                                    value={form[name]}
                                    onChange={this.handleChange}
                                    onFocus={() => this.setState({ focusedField: name })}
                                    onBlur={() => this.setState({ focusedField: null })}
                                    style={this.inputStyle(name)}
                                    autoComplete="off"
                                />
                            </div>
                        ))}
                    </div>

                    {([
                        { name: 'username', label: 'Username', type: 'text' },
                        { name: 'email', label: 'Email', type: 'email' },
                        { name: 'password', label: 'Password', type: 'password' },
                    ] as Array<{name: keyof IFormState; label: string; type: string}>).map(({ name, label, type }) => (
                        <div key={name} style={styles.field}>
                            <label style={styles.label} htmlFor={name}>{label}</label>
                            <input
                                id={name}
                                name={name}
                                type={type}
                                value={form[name]}
                                onChange={this.handleChange}
                                onFocus={() => this.setState({ focusedField: name })}
                                onBlur={() => this.setState({ focusedField: null })}
                                style={this.inputStyle(name)}
                                autoComplete={name === 'password' ? 'new-password' : 'off'}
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={submitting}
                        style={submitting
                            ? { ...styles.submitBtn, ...styles.submitBtnDisabled }
                            : styles.submitBtn}
                    >
                        {submitting ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <div style={styles.footer}>
                    Already have an account?
                    <a href="/" style={styles.loginLink}>Sign in</a>
                </div>
            </div>
        );
    }
}
