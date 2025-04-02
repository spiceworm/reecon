def class__str__(class_name, **kwargs):
    """
    Returns a string representation of the class instance.

    Args:
        class_name (str): The name of the class.
        **kwargs: Additional keyword arguments representing the properties of the class.

    Returns:
        str: A string representation of the class instance.
    """
    properties = ", ".join(f"{k}={v}" for k, v in kwargs.items())
    return f"{class_name}({properties})"
