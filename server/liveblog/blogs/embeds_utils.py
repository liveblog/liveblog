
def setting_value(settings, group_name, property_name):
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
        serializer_ignore = group.get('serializer_ignore', False)
        if serializer_ignore:
            continue

        group_name = group.get('name')
        css_selector = group.get('cssSelector')

        if not css_selector:
            continue

        for opt in group.get('options'):
            tag_name = opt.get('tagName', '')
            property_name = opt.get('property')
            linked_to_group = opt.get('linkedToGroup', False)

            if not property_name:
                continue

            option_selector = '{} {}'.format(css_selector, tag_name).strip()
            option_value = setting_value(settings, group_name, property_name)

            # in case the option value is linked to another group's attribute value
            # we need to extract the value of the connected one
            if linked_to_group:
                option_value = setting_value(settings, linked_to_group, option_value)

            if not option_value:
                continue

            _styles = styles_map.setdefault(option_selector, [])
            _styles.append((opt.get('property'), option_value))

    return convert_dict_to_css(styles_map)
