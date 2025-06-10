Feature: Forever Header functionality
  As a user I can design headers using the Forever Header tool
  So that I can create wavy backgrounds with icons and export them

  Background:
    Given I open the Forever Header page

  Scenario: Customisable halftone shapes
    When I select the "Circles" shape
    And I apply the shape
    Then the halftone path should update

  Scenario: Font Awesome icon integration
    When I enter the icon class "fa-solid fa-star"
    And I apply the icon
    Then the displayed icon should change

  Scenario: Toggle dither colour
    When I toggle the dither colour
    Then the halftone fill should invert

  Scenario: Export design as PNG
    When I download the image
    Then a PNG download should be triggered

  Scenario: Responsive UI at small width
    When I resize the window to 375 by 600
    Then the header should remain visible
