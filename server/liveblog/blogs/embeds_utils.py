
def get_setting_value(settings, group_name, property_name):
    """
    Extracts the style setting value for the given option
    """

    group = settings.get(group_name)
    if not group:
        return

    option_value = group.get(property_name)

    return option_value


def convert_dict_to_css(styles_map):
    """
    It receives a dictionary with selector and corresponding styles array
    in a JSON similar structure and converts is to css compatible string
    Eg:
        {'div.lb-timeline': [('font-weight', 'normal'), ('font-style', 'normal')]}
    """

    styles = []
    for selector, properties in styles_map.items():
        props_map = map(lambda x: '{0}: {1}'.format(x[0], x[1]), properties)
        group_rules = dict(selector=selector, props="; ".join(props_map))
        css_group_rules = '{selector} {{ {props} }}'.format(**group_rules)
        styles.append(css_group_rules)

    return "\n".join(styles)


def build_css_selector(group_selector, styleOption):
    """
    Creates a compound css selector with the provided
    group selector and the option tag name if any
    E.g: `div.timeline a`
    """
    tag_name = styleOption.get('tagName', '')
    css_selector = '{} {}'.format(group_selector, tag_name).strip()

    return css_selector


def generate_theme_styles(theme):
    """
    It gets `styleSettings` attribute from the theme and generate
    the coresponding css styling rules
    """

    options_groups = theme.get('styleOptions', {})
    settings = theme.get('styleSettings', {})

    if not options_groups or not settings:
        return ""

    styles_map = {}
    for group in options_groups:
        group_name = group.get('name')
        serializer_ignore = group.get('serializerIgnore', False)
        css_selector = group.get('cssSelector')

        if serializer_ignore or not css_selector:
            continue

        for style_option in group.get('options', []):
            property_name = style_option.get('property')
            linked_to_group = style_option.get('linkedToGroup', False)
            default_value = style_option.get('default')

            if not property_name:
                continue

            option_value = get_setting_value(settings, group_name, property_name)

            # if linked, then we need to extract the value of the connected one
            if linked_to_group:
                option_value = get_setting_value(settings, linked_to_group, option_value)

            if not option_value and default_value:
                option_value = default_value

            # we get to this point and no value so far, then skip this option
            if not option_value:
                continue

            final_css_selector = build_css_selector(css_selector, style_option)
            styles = styles_map.setdefault(final_css_selector, [])
            styles.append((property_name, option_value))

    return convert_dict_to_css(styles_map)


def google_fonts_url(theme):
    """
    This extracts the fonts from the settings if there are any `fontpicker`
    type of style attribute defined in the theme.

    Returns None or something like this if fontpicker found:
        https://fonts.googleapis.com/css2?family={LIST_OF_FONTS}&display=swap

        See for more info: https://developers.google.com/fonts/docs/css2
    """

    options_groups = theme.get('styleOptions', {})
    settings = theme.get('styleSettings', {})

    if not options_groups or not settings:
        return None

    # let's extract the fontpicker ones
    fonts_list = []
    for group in options_groups:
        group_name = group.get('name')

        for opt in group.get('options'):
            field_type = opt.get('type')
            property_name = opt.get('property')

            if not property_name:
                continue

            if field_type == 'fontpicker':
                value = get_setting_value(settings, group_name, property_name)

                if not value:
                    continue

                fonts_list.append('family={}:ital,wght@0,400;0,600;1,400;1,600'.format(value.replace(' ', '+')))

    if not fonts_list:
        return None

    return 'https://fonts.googleapis.com/css2?{}&display=swap'.format('&'.join(fonts_list))
