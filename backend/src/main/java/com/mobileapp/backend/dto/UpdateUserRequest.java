package com.mobileapp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUserRequest {

    @NotBlank(message = "{validation.firstname.required}")
    @Size(max = 50, message = "{validation.firstname.size}")
    private String firstName;

    @NotBlank(message = "{validation.lastname.required}")
    @Size(max = 50, message = "{validation.lastname.size}")
    private String lastName;

    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    private String email;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
