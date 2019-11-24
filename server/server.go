package main

import (
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/99designs/gqlgen/handler"
	"github.com/federation/enterprise"
)

func main() {
	log := logrus.New()

	viper.SetConfigName("enterprise")
	viper.AddConfigPath(".")

	viper.SetDefault("ENTERPRISE_WEB", "/tmp")

	switch err := viper.MergeInConfig().(type) {
	case nil:
		log.Info("Configuration file loaded")
	case viper.ConfigFileNotFoundError:
		log.Info("No configuration loaded")
	default:
		log.Panicf("Problem reading the configuration file: %s\n", err)
	}

	log.WithFields(logrus.Fields{
		"animal": "walrus",
		"size":   10,
	}).Info("A group of walrus emerges from the ocean")

	serveMux := http.NewServeMux()
	serveMux.Handle("/graphiql", handler.Playground("GraphQL playground", "/api/graphql"))
	serveMux.Handle("/graphql", handler.GraphQL(enterprise.NewExecutableSchema(enterprise.Config{Resolvers: &enterprise.Resolver{}})))

	server := &http.Server{
		Addr:    ":8080",
		Handler: serveMux,
	}

	c := make(chan os.Signal)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		_ = server.Close()
	}()

	log.Info("Starting the server")

	err := server.ListenAndServe()

	switch err {
	case http.ErrServerClosed:
		log.Info("Server has been closed")
	case nil:
		log.Info("Server is shutting down")
	default:
		log.Panicf("There was a problem starting the server: %s\n", err)
	}
}
