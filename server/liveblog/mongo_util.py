def encode(string):
    return string.replace('.', "\\uFF0").replace('$', "\\uFF04")


def decode(string):
    return string.replace("\\uFF0", '.').replace("\\uFF04", '$')
