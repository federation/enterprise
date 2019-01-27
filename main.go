package main

import (
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
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

	fields := graphql.Fields{
		"hello": &graphql.Field{
			Type: graphql.String,
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				return "world", nil
			},
		},
	}
	rootQuery := graphql.ObjectConfig{Name: "RootQuery", Fields: fields}
	schemaConfig := graphql.SchemaConfig{Query: graphql.NewObject(rootQuery)}

	var schema, _ = graphql.NewSchema(schemaConfig)

	graphqlHandler := handler.New(&handler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})

	serveMux := http.NewServeMux()
	serveMux.Handle("/graphql", graphqlHandler)

	server := &http.Server{
		Addr:    ":8080",
		Handler: serveMux,
	}

	c := make(chan os.Signal)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-c
		log.Info("Shutting down server")
		server.Close()
	}()

	log.Info("Starting the server")
	server.ListenAndServe()
}
