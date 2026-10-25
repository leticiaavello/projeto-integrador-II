from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from .permissions import PERFIS, nome_exibicao
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Bloqueio, Equipamento, Espaco, Manutencao, Reserva
from .services import (
    interpretar_horario,
    motivos_de_indisponibilidade,
    travar_recurso,
)


class EspacoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Espaco
        fields = [
            'id', 'tipo', 'nome', 'localizacao', 'bloco',
            'capacidade', 'descricao', 'situacao',
        ]

    def validate_nome(self, valor):
        valor = valor.strip()
        repetidos = Espaco.objects.filter(nome__iexact=valor)
        if self.instance:
            repetidos = repetidos.exclude(pk=self.instance.pk)
        if repetidos.exists():
            raise serializers.ValidationError('Já existe um espaço com este nome.')
        return valor


class EquipamentoSerializer(serializers.ModelSerializer):
    # O front-end chama de "local"; no banco o campo é "localizacao".
    local = serializers.CharField(
        source='localizacao', required=False, allow_blank=True
    )

    class Meta:
        model = Equipamento
        fields = [
            'id', 'patrimonio', 'simplificado', 'tipo', 'marca',
            'modelo', 'local', 'situacao', 'descricao',
        ]
        extra_kwargs = {
            'patrimonio': {'required': False, 'allow_null': True, 'allow_blank': True},
            'simplificado': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def _vazio_para_none(self, valor):
        valor = (valor or '').strip()
        return valor or None

    def validate_patrimonio(self, valor):
        return self._vazio_para_none(valor)

    def validate_simplificado(self, valor):
        return self._vazio_para_none(valor)

    def validate(self, attrs):
        patrimonio = attrs.get('patrimonio', getattr(self.instance, 'patrimonio', None))
        simplificado = attrs.get('simplificado', getattr(self.instance, 'simplificado', None))
        if not patrimonio and not simplificado:
            raise serializers.ValidationError(
                'Informe o nº de patrimônio ou o nº simplificado.'
            )
        return attrs

    def to_representation(self, instance):
        dados = super().to_representation(instance)
        # O front chama .toLowerCase() nesses campos; null quebraria a tela.
        for chave in ('patrimonio', 'simplificado'):
            dados[chave] = dados[chave] or ''
        return dados


class ReservaSerializer(serializers.ModelSerializer):
    horario = serializers.CharField()
    status = serializers.SerializerMethodField()
    usuario = serializers.SerializerMethodField()

    class Meta:
        model = Reserva
        fields = [
            'id', 'recurso', 'data', 'horario', 'finalidade',
            'turma', 'status', 'usuario',
        ]
        extra_kwargs = {
            'recurso': {'required': True, 'allow_blank': False},
            'turma': {'required': False, 'allow_blank': True},
            'finalidade': {'required': False, 'allow_blank': True},
        }

    def get_status(self, obj):
        return obj.status.lower()  # "ATIVA" -> "ativa" (como o front espera)

    def get_usuario(self, obj):
        return nome_exibicao(obj.usuario) if obj.usuario else obj.responsavel

    def validate(self, attrs):
        faixa = interpretar_horario(attrs.get('horario', ''))
        if faixa is None and 'horario' in attrs:
            raise serializers.ValidationError(
                {'horario': 'Horário inválido. Use o formato 07h50–08h40.'}
            )
        if faixa:
            if faixa[0] >= faixa[1]:
                raise serializers.ValidationError(
                    {'horario': 'O horário final deve ser depois do inicial.'}
                )
            attrs['horario_inicio'], attrs['horario_fim'] = faixa
        attrs.pop('horario', None)

        data = attrs.get('data')
        if data and not self.instance and data < timezone.localdate():
            raise serializers.ValidationError(
                {'data': 'Não é possível reservar em uma data passada.'}
            )
        return attrs

    def _checar(self, recurso, data, inicio, fim, ignorar=None):
        motivos = motivos_de_indisponibilidade(
            recurso, data, inicio, fim, ignorar_reserva=ignorar
        )
        if motivos:
            raise serializers.ValidationError(motivos)

    @transaction.atomic
    def create(self, validated_data):
        usuario = self.context['request'].user
        validated_data['usuario'] = usuario
        validated_data['responsavel'] = nome_exibicao(usuario)
        validated_data['finalidade'] = validated_data.get('finalidade') or 'Reserva'
        travar_recurso(validated_data['recurso'], validated_data['data'])
        self._checar(
            validated_data['recurso'], validated_data['data'],
            validated_data['horario_inicio'], validated_data['horario_fim'],
        )
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        recurso = validated_data.get('recurso', instance.recurso)
        data = validated_data.get('data', instance.data)
        inicio = validated_data.get('horario_inicio', instance.horario_inicio)
        fim = validated_data.get('horario_fim', instance.horario_fim)
        travar_recurso(recurso, data)
        if instance.status == 'ATIVA':
            self._checar(recurso, data, inicio, fim, ignorar=instance.pk)
        return super().update(instance, validated_data)


class BloqueioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bloqueio
        fields = ['id', 'tipo', 'recurso', 'motivo', 'data', 'aula', 'origem']
        read_only_fields = ['origem']
        extra_kwargs = {
            'motivo': {'required': False, 'allow_blank': True},
            'aula': {'required': False, 'allow_blank': True},
            'data': {'required': False, 'allow_null': True},
        }


class ManutencaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manutencao
        fields = [
            'id', 'tipo', 'recurso', 'inicio', 'previsao', 'motivo', 'situacao',
        ]
        extra_kwargs = {
            'previsao': {'required': False, 'allow_null': True},
            'motivo': {'required': False, 'allow_blank': True},
        }



class UsuarioAdminSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(max_length=150)
    first_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )
    email = serializers.EmailField()
    perfil = serializers.ChoiceField(
        choices=[(codigo, codigo) for codigo in PERFIS.values()]
    )
    password = serializers.CharField(
        write_only=True,
        min_length=10,
        required=False,
        trim_whitespace=False,
    )
    is_active = serializers.BooleanField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)

    def validate_username(self, value):
        Usuario = get_user_model()
        usuarios = Usuario.objects.filter(username__iexact=value)

        if self.instance:
            usuarios = usuarios.exclude(pk=self.instance.pk)

        if usuarios.exists():
            raise serializers.ValidationError(
                'Este nome de usuario ja esta em uso.'
            )

        return value

    def validate_email(self, value):
        Usuario = get_user_model()
        usuarios = Usuario.objects.filter(email__iexact=value)

        if self.instance:
            usuarios = usuarios.exclude(pk=self.instance.pk)

        if usuarios.exists():
            raise serializers.ValidationError(
                'Este e-mail ja esta cadastrado.'
            )

        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({
                'password': 'A senha e obrigatoria no cadastro.'
            })

        return attrs

    def to_representation(self, instance):
        grupos = set(instance.groups.values_list('name', flat=True))

        perfil = next(
            (
                codigo
                for nome, codigo in PERFIS.items()
                if nome in grupos
            ),
            None,
        )

        return {
            'id': instance.pk,
            'username': instance.username,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'email': instance.email,
            'perfil': perfil,
            'is_active': instance.is_active,
            'date_joined': self.fields['date_joined'].to_representation(
                instance.date_joined
            ),
        }

    def create(self, validated_data):
        Usuario = get_user_model()
        perfil = validated_data.pop('perfil')
        senha = validated_data.pop('password')

        usuario = Usuario.objects.create_user(
            password=senha,
            **validated_data,
        )

        nome_grupo = next(
            nome for nome, codigo in PERFIS.items()
            if codigo == perfil
        )
        grupo, _ = Group.objects.get_or_create(name=nome_grupo)
        usuario.groups.set([grupo])

        return usuario

    def update(self, instance, validated_data):
        perfil = validated_data.pop('perfil', None)
        senha = validated_data.pop('password', None)

        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)

        if senha:
            instance.set_password(senha)

        instance.save()

        if perfil is not None:
            nome_grupo = next(
                nome for nome, codigo in PERFIS.items()
                if codigo == perfil
            )
            grupo, _ = Group.objects.get_or_create(name=nome_grupo)
            instance.groups.set([grupo])

        return instance