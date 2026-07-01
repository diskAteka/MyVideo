FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["MainServer/MainServer.csproj", "MainServer/"]
COPY ["SharedLib/SharedLib.csproj", "SharedLib/"]

RUN dotnet restore "MainServer/MainServer.csproj"

COPY . .

WORKDIR "/src/MainServer"
RUN dotnet publish "MainServer.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

RUN mkdir -p /MainServer/temp_videos
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

EXPOSE 8080

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "MainServer.dll"]