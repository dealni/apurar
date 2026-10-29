"""Identidade territorial comum entre catálogo, resultados e motor municipal."""


def unit_key(scope, uf):
    return "ZZ:aggregate" if scope == "zz" else uf.upper() + ":" + scope[-5:]


def model_units(wrappers):
    result = {}
    for wrapper in wrappers:
        value = wrapper.get("result")
        if value:
            key = unit_key(value["scope"], wrapper["uf"])
            result[key] = {
                "unit_id": key,
                "sections_counted": value["sections_counted"],
                "votes": value["votes"],
            }
    return result
