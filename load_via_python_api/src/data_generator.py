from random import choice

from customer import Address, Customer
from faker import Faker

FAKERS = [Faker("en_US"), Faker("en_AU"), Faker("en_GB")]


def create_fake_address(faker: Faker) -> Address:

    current_country_code = faker.current_country_code()

    if current_country_code == "GB":
        state = faker.county()
        postal_code = faker.postcode()
    elif current_country_code == "US":
        state = faker.state()
        postal_code = faker.zipcode()
    elif current_country_code == "AU":
        state = faker.state()
        postal_code = faker.postcode()
    else:
        raise ValueError("%s is not recognized.", current_country_code)
    return Address(
        street=faker.street_name(),
        city=faker.city(),
        state=state,
        postalCode=postal_code,
        country=faker.current_country(),
    )


def create_fake_customer() -> Customer:

    faker = choice(FAKERS)
    # faker = FAKER_GB
    return Customer(
        customerId=faker.uuid4(),
        firstName=faker.first_name(),
        lastName=faker.last_name(),
        email=faker.email(),
        phone=faker.phone_number(),
        address=create_fake_address(faker),
    )
