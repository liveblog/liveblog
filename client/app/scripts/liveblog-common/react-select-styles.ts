import type { Styles } from 'react-select/src/styles';

export const selectStyles: Styles = {
    control: (provided, state) => {
        const styles = {
            ...provided,
            borderRadius: '3px',
            minHeight: '32px',
            borderColor: '#d9d9d9',
            cursor: 'pointer',
            '&:hover': {
                borderColor: '#5ea9c8',
            },
        };

        if (state.menuIsOpen || state.isFocused) {
            styles.borderColor = '#5ea9c8';
            styles.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.15)';
        }

        return styles;
    },

    dropdownIndicator: (provided) => ({
        ...provided,
        padding: '6px',
    }),

    clearIndicator: (provided) => ({
        ...provided,
        padding: '6px',
    }),

    valueContainer: (provided) => ({
        ...provided,
        padding: '2px 3px',
    }),
};
