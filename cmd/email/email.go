package email

import (
	"net/smtp"
	"os"
)

func SendEmail(respBody []byte) {
	from := os.Getenv("EMAIL_ADDRESS")
	password := os.Getenv("EMAIL_PASSWORD")

	toEmailAddress := os.Getenv("EMAIL_ADDRESS")
	to := []string{toEmailAddress}

	host := "smtp.gmail.com"
	port := "587"
	address := host + ":" + port

	subject := "Subject: Goalie Switcher Failed\n"
	body := string(respBody)
	message := []byte(subject + body)

	auth := smtp.PlainAuth("", from, password, host)

	err := smtp.SendMail(address, auth, from, to, message)
	if err != nil {
		panic(err)
	}
}
