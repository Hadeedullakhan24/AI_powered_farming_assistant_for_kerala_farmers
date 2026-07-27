from datetime import datetime


def get_season():
    """
    Returns the current agricultural season in India
    based on the current month.
    """

    month = datetime.now().month

    if month in [6, 7, 8, 9]:
        return "Monsoon"

    elif month in [10, 11]:
        return "Post-Monsoon"

    elif month in [12, 1, 2]:
        return "Winter"

    elif month in [3, 4, 5]:
        return "Summer"

    return "Unknown"